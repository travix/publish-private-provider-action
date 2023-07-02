import { debug } from "@actions/core";
import { promises as Fs } from "fs";

export enum ArtifactType {
    Archive = "Archive",
    Binary = "Binary",
    Checksum = "Checksum",
    Signature = "Signature"
}

export type Artifact = Checksum | Signature | Binary | Archive;

interface Checksum {
    name: string;
    path: string;
    type: ArtifactType.Checksum;
    extra: Record<string, unknown>;
}

interface Signature {
    name: string;
    path: string;
    type: ArtifactType.Signature;
    extra: {
        ID: string;
    };
}

interface Binary {
    name: string;
    path: string;
    type: ArtifactType.Binary;
    goos: string;
    goarch: string;
    extra: {
        ID: string;
        Binary: string;
        Ext: string;
    };
}

interface Archive {
    name: string;
    path: string;
    type: ArtifactType.Archive;
    goos: string;
    goarch: string;
    extra: {
        ID: string;
        Binaries: string[];
        Builds: [
            {
                name: string;
                path: string;
                goos: string;
                goarch: string;
                extra: {
                    Binary: string;
                    Ext: string;
                    ID: string;
                };
            }
        ];
        Checksum: string;
        Format: string;
        Replaces: unknown;
        WrappedIn: string;
    };
}

export const ArtifactPath = (artifacts: Artifact[], type: ArtifactType): string => {
    const checksum = artifacts.find(artifact => artifact.type === type);
    if (!checksum) {
        throw new Error(`No artifact of ${type} type found`);
    }
    return checksum.path;
};

export const LoadArtifacts = async (artifactsJson: string, artifactsJsonPath: string): Promise<Artifact[]> => {
    if (artifactsJson) {
        debug(`Loading artifacts from json input`);
        return JSON.parse(artifactsJson);
    }
    debug(`Loading artifacts from ${artifactsJsonPath}`);
    return JSON.parse(await Fs.readFile(artifactsJsonPath, "utf8"));
};
