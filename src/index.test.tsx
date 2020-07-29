import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { useListen, notify } from "./index";

function Example({
  getter,
}: {
  getter: (signal: AbortSignal) => Promise<any[]>;
}) {
  const cats = useListen(["cats"], getter, []);

  if (cats === undefined) {
    return <div>Loading</div>;
  }

  return <div>{cats.length}</div>;
}

describe("provider", () => {
  it("renders correctly", async () => {
    await act(async function () {
      const cats = [
        [{ name: "Bang!" }],
        [{ name: "Bang!" }, { name: "Crash!" }],
        [{ name: "Bang!" }, { name: "Crash!" }, { name: "Wham!" }],
      ];

      function getCats(signal: AbortSignal): Promise<any[]> {
        return new Promise((accept) => accept(cats.shift()));
      }

      const { container } = render(<Example getter={getCats} />);

      expect(container.querySelector("div")?.textContent).toBe("Loading");

      await waitFor(
        () => {
          expect(container.querySelector("div")?.textContent).toBe("1");
        },
        { container }
      );

      notify("cats");

      await waitFor(
        () => {
          expect(container.querySelector("div")?.textContent).toBe("2");
        },
        { container }
      );
    });
  });
});
