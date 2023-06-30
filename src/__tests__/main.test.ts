import { getInput, setFailed } from "@actions/core";
import { ArtifactPath, ArtifactType, LoadArtifacts } from "lib/artifact";
import { Context } from "lib/github";
import { TerraformCloudApi } from "lib/terraform-cloud";
import { resolve } from "path";
import { asMock } from "test-lib";
import { describe, expect, test, vi } from "vitest";

import { Inputs, main } from "../main";

vi.mock("@actions/core");
vi.mock("path");
vi.mock("lib/artifact");
vi.mock("lib/github");
vi.mock("lib/terraform-cloud");

describe("getInputs", () => {
    test("should return inputs", () => {
        for (const input of ["dist1", "key-id1", "namespace1", "provider1", "access-token1", "version1"]) {
            asMock(getInput).mockReturnValueOnce(input);
        }
        const inputs = new Inputs();
        expect(inputs).toEqual({
            distPath: "dist1",
            gpgKeyId: "key-id1",
            namespace: "namespace1",
            provider: "provider1",
            accessToken: "access-token1",
            version: "ersion1"
        });
    });
    test("should return inputs with defaults", () => {
        for (const input of ["", "", "", "", "access-token1", ""]) {
            asMock(getInput).mockReturnValueOnce(input);
        }
        asMock(Context).mockReturnValueOnce({
            repo: {
                owner: "travix",
                repo: "terraform-provider-xyz"
            },
            eventName: "push",
            refType: "tag",
            refName: "v1.2.3"
        });
        const inputs = new Inputs();
        expect(inputs).toEqual({
            distPath: "dist",
            gpgKeyId: "",
            namespace: "travix",
            provider: "xyz",
            accessToken: "access-token1",
            version: "1.2.3"
        });
    });
    test("should throw if version is not supplied and event is not tag", () => {
        asMock(Context).mockReturnValueOnce({
            repo: {
                owner: "travix",
                repo: "terraform-provider-xyz"
            },
            eventName: "push",
            refType: "branch"
        });
        expect(() => {
            new Inputs();
        }).toThrowError("Input required and not supplied: version");
    });
});

describe("main", () => {
    test("should upload artifacts", async () => {
        for (const input of ["dist1", "key-id1", "namespace1", "provider1", "access-token1", "version1"]) {
            asMock(getInput).mockReturnValueOnce(input);
        }
        asMock(LoadArtifacts).mockResolvedValueOnce([
            {
                goarch: "amd64",
                name: "name1",
                goos: "linux",
                path: "path1",
                extra: {
                    Checksum: "checksum1"
                },
                type: ArtifactType.Archive
            },
            {
                name: "name1",
                path: "path1",
                type: ArtifactType.Binary,
                goos: "linux",
                goarch: "amd64",
                extra: {
                    ID: "id1",
                    Binary: "binary1",
                    Ext: ""
                }
            }
        ]);
        const apiMock = new TerraformCloudApi("access-token1", "namespace1", "provider1", "version1");
        asMock(TerraformCloudApi).mockReturnValueOnce(apiMock);
        asMock(apiMock.CreateVersion).mockResolvedValueOnce(undefined);
        asMock(apiMock.CreatePlatform).mockResolvedValueOnce(undefined);
        asMock(ArtifactPath).mockReturnValueOnce("checksum1");
        asMock(ArtifactPath).mockReturnValueOnce("signature1");
        asMock(resolve).mockReturnValueOnce("/cwd/dist1/artifacts.json");
        await main();
        expect(LoadArtifacts).toHaveBeenCalledWith("/cwd/dist1/artifacts.json");
        expect(TerraformCloudApi).toHaveBeenCalledWith("access-token1", "namespace1", "provider1", "version1");
        expect(apiMock.CreateVersion).toHaveBeenCalledWith("checksum1", "signature1", "key-id1");
        expect(apiMock.CreatePlatform).toHaveBeenCalledWith({
            os: "linux",
            shasum: "checksum1",
            arch: "amd64",
            filename: "name1",
            path: "path1"
        });
    });
    test("should fail if no artifacts are found", async () => {
        for (const input of ["", "", "namespace1", "provider1", "access-token1", "version1"]) {
            asMock(getInput).mockReturnValueOnce(input);
        }
        asMock(LoadArtifacts).mockResolvedValueOnce([]);
        asMock(resolve).mockReturnValueOnce("/cwd/dist/artifacts.json");
        await main();
        expect(setFailed).toHaveBeenCalledWith("No archives found in /cwd/dist/artifacts.json to upload");
    });
});
