# use-listen

Allow a React component to subscribe to global state updates.

A re-render will be triggered when notify is called:

```jsx
import { notify, useListen } from "use-listen";

async function getCats(signal) {
  const response = await fetch("/api/cats", { signal: signal });

  // ...

  return await response.json();
}

async function insertCat(cat) {
  const response = await fetch("/api/cats", {
    method: "POST",
    body: JSON.stringify(cat),
  });

  // ...

  // trigger a re-fetch for every component subscribed to 'cats'
  notify("cats");
}

function withCats(Component) {
  return function (props) {
    // call getCats whenever notify is called with 'cats'
    const cats = useListen(["cats"], getCats);

    if (cats === undefined) {
      return <div>Loading...</div>;
    }

    return <Component cats={cats} {...props} />;
  };
}

const Cats = withCats(function Cats({ cats }) {
  const onClick = React.useCallback(function () {
    insertCat({ name: "meow!" });
  }, []);

  return (
    <>
      <ul>
        {cats.map(function (cat) {
          return <li key={cat.id}>{cat}</li>;
        })}
      </ul>
      <a onClick={insertCat}>Add</a>
    </>
  );
});
```
