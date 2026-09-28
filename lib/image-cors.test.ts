import { describe, it, expect } from "vitest";
import { imageCrossOrigin } from "./image-cors";

describe("imageCrossOrigin", () => {
  it("fetches cookie-setting jimcdn images anonymously", () => {
    expect(imageCrossOrigin("https://image.jimcdn.com/app/cms/image/x.jpg")).toBe("anonymous");
  });

  it("leaves other hosts alone (they may not send CORS headers)", () => {
    expect(imageCrossOrigin("https://example.com/image.jimcdn.com.jpg")).toBeUndefined();
    expect(imageCrossOrigin("https://static.wixstatic.com/media/x.jpg")).toBeUndefined();
  });

  it("ignores a missing or unparsable src", () => {
    expect(imageCrossOrigin(undefined)).toBeUndefined();
    expect(imageCrossOrigin("")).toBeUndefined();
    expect(imageCrossOrigin("not a url")).toBeUndefined();
  });
});
