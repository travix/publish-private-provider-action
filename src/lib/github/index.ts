import { Context as GhContext } from "@actions/github/lib/context";

declare let process: {
    env: {
        GITHUB_REF_NAME: string;
        GITHUB_REPOSITORY: string;
        GITHUB_REF_TYPE: string;
    };
};

export class Context extends GhContext {
    public readonly fullRepoName = process.env.GITHUB_REPOSITORY;
    public readonly refName = process.env.GITHUB_REF_NAME;
    public readonly refType = process.env.GITHUB_REF_TYPE;
}
