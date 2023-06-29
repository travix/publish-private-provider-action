import { describe, expect, test } from "vitest";

import { Artifact, ArtifactPath, ArtifactType, LoadArtifacts } from "../";

describe("ArtifactPath", () => {
    test("should return path", () => {
        const artifacts: Artifact[] = [
            { name: "checksum", path: "checksum", type: ArtifactType.Checksum, extra: {} },
            { name: "signature", path: "signature", type: ArtifactType.Signature, extra: { ID: "id" } },
            {
                name: "binary",
                path: "binary",
                type: ArtifactType.Binary,
                goos: "linux",
                goarch: "amd64",
                extra: { ID: "id", Binary: "binary", Ext: "ext" }
            },
            {
                name: "archive",
                path: "archive",
                type: ArtifactType.Archive,
                goos: "linux",
                goarch: "amd64",
                extra: {
                    ID: "id",
                    Binaries: ["binaries"],
                    Builds: [
                        {
                            name: "build",
                            path: "build",
                            goos: "linux",
                            goarch: "amd64",
                            extra: { Binary: "binary", Ext: "ext", ID: "id" }
                        }
                    ],
                    Checksum: "checksum",
                    Format: "format",
                    Replaces: null,
                    WrappedIn: "wrapped-in"
                }
            }
        ];
        expect(ArtifactPath(artifacts, ArtifactType.Checksum)).toEqual("checksum");
        expect(ArtifactPath(artifacts, ArtifactType.Signature)).toEqual("signature");
        expect(ArtifactPath(artifacts, ArtifactType.Binary)).toEqual("binary");
        expect(ArtifactPath(artifacts, ArtifactType.Archive)).toEqual("archive");
    });
    test("should throw if artifact is not found", () => {
        const artifacts: Artifact[] = [];
        expect(() => {
            ArtifactPath(artifacts, ArtifactType.Checksum);
        }).toThrowError("No artifact of Checksum type found");
    });
});

describe("LoadArtifacts", () => {
    test("should load artifacts", async () => {
        await expect(LoadArtifacts(__dirname + "/artifacts.test1.json")).resolves.toEqual([
            {
                name: "checksum",
                path: "checksum",
                type: ArtifactType.Checksum,
                extra: {}
            }
        ]);
    });
});
