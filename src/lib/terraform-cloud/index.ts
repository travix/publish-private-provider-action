import { debug, info } from "@actions/core";
import fs from "fs";
import { Got, got, Headers } from "got";

interface ListResponse {
    data: Array<{
        attributes: {
            "key-id": string;
        };
    }>;
}

interface CreateVersionResponse {
    data: {
        links: {
            "shasums-upload": string;
            "shasums-sig-upload": string;
        };
    };
}

interface CreatePlatformResponse {
    data: {
        links: {
            "provider-binary-upload": string;
        };
    };
}

interface Platform {
    os: string;
    arch: string;
    shasum: string;
    filename: string;
    path: string;
}

export class TerraformCloudApi {
    private client: Got;

    public constructor(
        private token: string,
        private namespace: string,
        private provider: string,
        private version: string
    ) {
        this.client = got.extend({
            prefixUrl: "https://app.terraform.io",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/vnd.api+json"
            }
        });
    }

    async firstKeyId(): Promise<string> {
        debug(`Fetching first GPG key for ${this.namespace}`);
        const result: ListResponse = await this.client
            .get(`api/registry/private/v2/gpg-keys?filter[namespace]=${this.namespace}`)
            .json();
        if (result?.data?.length > 0) {
            return result.data[0].attributes["key-id"];
        }
        throw new Error(`No GPG keys found for namespace '${this.namespace}'`);
    }

    public async CreateVersion(checksumPath: string, signaturePath: string, keyId?: string) {
        info(`Creating version ${this.version}`);
        keyId = keyId || (await this.firstKeyId());
        const url = `api/v2/organizations/${this.namespace}/registry-providers/private/${this.namespace}/${this.provider}/versions`;
        const payload = {
            data: {
                type: "registry-provider-versions",
                attributes: { version: this.version, "key-id": keyId, protocols: ["6.0"] }
            }
        };
        const result: CreateVersionResponse = await this.client.post(url, { json: payload }).json();
        debug(`Version created on ${url}`);
        await fileUpload(result.data.links["shasums-upload"], checksumPath);
        await fileUpload(result.data.links["shasums-sig-upload"], signaturePath);
        info(`Version ${this.version} created`);
    }

    public async CreatePlatform({ os, arch, shasum, filename, path }: Platform) {
        info(`Creating platform ${os}/${arch} for ${filename} with sha256 ${shasum}`);
        const url = `api/v2/organizations/${this.namespace}/registry-providers/private/${this.namespace}/${this.provider}/versions/${this.version}/platforms`;
        const payload = {
            data: {
                type: "registry-provider-version-platforms",
                attributes: {
                    os: os,
                    arch: arch,
                    shasum: shasum.replace(/^"sha256:/, ""),
                    filename: filename
                }
            }
        };
        const result: CreatePlatformResponse = await this.client.post(url, { json: payload }).json();
        debug(`Platform created on ${url}`);
        await fileUpload(result.data.links["provider-binary-upload"], path);
        info(`Platform ${os}/${arch} for ${filename} created`);
    }
}

const fileUpload = async (url: string, filePath: string, headers?: Headers): Promise<void> => {
    debug(`Uploading ${filePath} to ${url}`);
    headers = headers ?? { "Content-Type": "text/plain" };
    const stream = fs.createReadStream(filePath);
    await got.put(url, { headers, body: stream });
};
