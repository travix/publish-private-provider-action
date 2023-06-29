import fs from "fs";
import nock, { cleanAll } from "nock";
import { asMock } from "test-lib";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import { TerraformCloudApi } from "../";

vi.mock("fs");
vi.mock("@actions/core");

describe("TerraformCloudApi", () => {
    const token = "token1";
    let apiScope: nock.Scope;
    let uploadScope: nock.Scope;
    beforeAll(() => {
        apiScope = nock("https://app.terraform.io", {
            reqheaders: {
                authorization: `Bearer ${token}`,
                "content-type": "application/vnd.api+json"
            }
        });
        uploadScope = nock("https://example.com", { reqheaders: { "content-type": "text/plain" } });
    });
    beforeEach(() => {
        cleanAll();
    });

    test("should returns a first GPG key", async () => {
        apiScope
            .get("/api/registry/private/v2/gpg-keys")
            .query({ "filter[namespace]": "travix" })
            .reply(200, { data: [{ attributes: { "key-id": "1234567890" } }] });
        const client = new TerraformCloudApi(token, "travix", "xyz", "1.0.0");
        const keyId = await client.firstKeyId();
        expect(keyId).toBe("1234567890");
        apiScope.done();
    });
    test("should throw error if no GPG keys found", async () => {
        apiScope
            .get("/api/registry/private/v2/gpg-keys")
            .query({ "filter[namespace]": "travix" })
            .reply(200, { data: [] });
        const client = new TerraformCloudApi(token, "travix", "xyz", "1.0.0");
        await expect(client.firstKeyId()).rejects.toThrowError("No GPG keys found for namespace 'travix'");
        apiScope.done();
    });
    test("should create a new version", async () => {
        apiScope
            .post("/api/v2/organizations/travix/registry-providers/private/travix/xyz/versions", {
                data: {
                    type: "registry-provider-versions",
                    attributes: { version: "1.0.0", "key-id": "1234567890", protocols: ["6.0"] }
                }
            })
            .reply(200, {
                data: {
                    links: {
                        "shasums-upload": "https://example.com/shasums-upload",
                        "shasums-sig-upload": "https://example.com/shasums-sig-upload"
                    }
                }
            });
        asMock(fs.createReadStream).mockReturnValueOnce("stream::checksums.txt");
        asMock(fs.createReadStream).mockReturnValueOnce("stream::checksums.txt.asc");
        uploadScope.put("/shasums-upload", "stream::checksums.txt").reply(200);
        uploadScope.put("/shasums-sig-upload", "stream::checksums.txt.asc").reply(200);
        const client = new TerraformCloudApi(token, "travix", "xyz", "1.0.0");
        await client.CreateVersion("checksums.txt", "checksums.txt.asc", "1234567890");
        expect(fs.createReadStream).toHaveBeenCalledTimes(2);
        apiScope.done();
        uploadScope.done();
    });
    test("should create a new version with first GPG key", async () => {
        apiScope
            .get("/api/registry/private/v2/gpg-keys")
            .query({ "filter[namespace]": "travix" })
            .reply(200, { data: [{ attributes: { "key-id": "1234567890" } }] });
        apiScope
            .post("/api/v2/organizations/travix/registry-providers/private/travix/xyz/versions", {
                data: {
                    type: "registry-provider-versions",
                    attributes: { version: "1.0.0", "key-id": "1234567890", protocols: ["6.0"] }
                }
            })
            .reply(200, {
                data: {
                    links: {
                        "shasums-upload": "https://example.com/shasums-upload",
                        "shasums-sig-upload": "https://example.com/shasums-sig-upload"
                    }
                }
            });
        uploadScope.put(/.*/).reply(200).persist();
        const client = new TerraformCloudApi(token, "travix", "xyz", "1.0.0");
        await client.CreateVersion("checksums.txt", "checksums.txt.asc", "");
        expect(fs.createReadStream).toHaveBeenCalledTimes(2);
        apiScope.done();
        uploadScope.done();
    });
    test("should create platform for provider", async () => {
        apiScope
            .post("/api/v2/organizations/travix/registry-providers/private/travix/xyz/versions/1.0.0/platforms", {
                data: {
                    type: "registry-provider-version-platforms",
                    attributes: {
                        os: "darwin",
                        arch: "amd64",
                        shasum: "asha256sums",
                        filename: "some.zip"
                    }
                }
            })
            .reply(200, {
                data: {
                    links: {
                        "provider-binary-upload": "https://example.com/provider-binary-upload"
                    }
                }
            });
        asMock(fs.createReadStream).mockReturnValueOnce("stream::some.zip");
        uploadScope.put("/provider-binary-upload", "stream::some.zip").reply(200);
        const client = new TerraformCloudApi(token, "travix", "xyz", "1.0.0");
        await client.CreatePlatform({
            os: "darwin",
            arch: "amd64",
            shasum: "asha256sums",
            filename: "some.zip",
            path: "/path1"
        });
        expect(fs.createReadStream).toHaveBeenCalledTimes(1);
        apiScope.done();
        uploadScope.done();
    });
});
