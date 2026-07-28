import { describe, expect, it } from "vitest";
import { truncate, stripHtml } from "@/lib/utils";

describe("truncate", () => {
  it("returns the original string when shorter than the limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends an ellipsis when longer than the limit", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
  });
});

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<p>Hello   <b>world</b></p>")).toBe("Hello world");
  });

  it("strips style and script blocks entirely", () => {
    const html = "<style>.a{color:red}</style><p>Visible</p><script>alert(1)</script>";
    expect(stripHtml(html)).toBe("Visible");
  });
});
