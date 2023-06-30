import { debug, getInput, info, setFailed } from "@actions/core";
import { ArtifactPath, ArtifactsJson, ArtifactType, LoadArtifacts } from "lib/artifact";
import { Context } from "lib/github";
import { TerraformCloudApi } from "lib/terraform-cloud";
import { join, resolve } from "path";

enum InputNames {
    DistPath = "dist-path",
    GpgKeyId = "gpg-key-id",
    Namespace = "namespace",
    Provider = "provider-name",
    AccessToken = "access-token",
    Version = "version"
}

export class Inputs {
    distPath: string;
    namespace: string;
    provider: string;
    accessToken: string;
    version: string;
    gpgKeyId?: string;

    constructor() {
        this.distPath = getInput(InputNames.DistPath);
        this.gpgKeyId = getInput(InputNames.GpgKeyId);
        this.namespace = getInput(InputNames.Namespace);
        this.provider = getInput(InputNames.Provider);
        this.accessToken = getInput(InputNames.AccessToken, { required: true });
        this.version = getInput(InputNames.Version);
        this.setDefaults();
        this.version = this.version.replace(/^v/, "");
    }

    private setDefaults() {
        if (!this.distPath) {
            this.distPath = "dist";
            debug(`dist-path not supplied, defaulting to "dist"`);
        }
        const context = new Context();
        if (!this.namespace) {
            this.namespace = context.repo.owner;
            debug(`namespace not supplied, defaulting to ${this.namespace}`);
        }
        if (!this.provider) {
            this.provider = context.repo.repo.replace("terraform-provider-", "");
            debug(`provider-name not supplied, defaulting to ${this.provider}`);
        }
        if (!this.version) {
            if (context.eventName !== "push" || context.refType !== "tag") {
                throw new Error(`Input required and not supplied: ${InputNames.Version}`);
            }
            this.version = context.refName;
            debug(`version not supplied, defaulting to ${this.version}`);
        }
    }
}

export async function main(): Promise<void> {
    try {
        const { accessToken, distPath, gpgKeyId, namespace, provider, version } = new Inputs();
        const artifactsJson = resolve(join(distPath, ArtifactsJson));
        const artifacts = await LoadArtifacts(artifactsJson);
        const totalArchives = artifacts.filter(a => a.type === ArtifactType.Archive).length;
        if (totalArchives === 0) {
            setFailed(`No archives found in ${artifactsJson} to upload`);
            return;
        }
        const client = new TerraformCloudApi(accessToken, namespace, provider, version);
        await client.CreateVersion(
            ArtifactPath(artifacts, ArtifactType.Checksum),
            ArtifactPath(artifacts, ArtifactType.Signature),
            gpgKeyId
        );
        for (const artifact of artifacts) {
            if (artifact.type !== ArtifactType.Archive) {
                debug(`Skipping ${artifact.type} artifact`);
                continue;
            }
            await client.CreatePlatform({
                os: artifact.goos,
                shasum: artifact.extra.Checksum,
                arch: artifact.goarch,
                filename: artifact.name,
                path: artifact.path
            });
        }
        info(`Published ${version} with ${totalArchives} artifacts`);
    } catch (error: unknown) {
        setFailed((error as Error).message);
    }
}

await main();
debug(`completed publish-private-provider-action`);

export default main;
