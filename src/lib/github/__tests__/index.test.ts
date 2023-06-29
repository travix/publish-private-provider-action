import { expect, test } from "vitest";

import { Context } from "../";

test("Should match github context", () => {
    process.env.GITHUB_REPOSITORY = "travix/publish-private-provider-action";
    process.env.GITHUB_REF_NAME = "branch-one";
    process.env.GITHUB_REF_TYPE = "tag";
    const actual = new Context();
    expect(actual).toMatchObject({
        fullRepoName: "travix/publish-private-provider-action",
        refName: "branch-one",
        refType: "tag"
    });
});
