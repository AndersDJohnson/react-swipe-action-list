import React, { useEffect, useRef, useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import { useWindowSize, useScroll, useUpdateEffect } from "react-use";
import { MdSettings, MdReply, MdDelete, MdUndo } from "react-icons/md";

import "./styles.css";

const RenderProp = ({ children, ...restProps }) => {
  if (typeof children === "function") return children(restProps);
  return children;
};

const Actions = props => <RenderProp {...props} />;

const Gutter = props => <RenderProp {...props} />;

const ListItem = ({
  children,
  onDismiss,
  index,
  item,
  onDismissStart,
  timeoutForDismiss = 2000
}) => {
  const liRef = useRef(null);
  const wrapRef = useRef(null);

  const { width, height } = useWindowSize();
  const { x } = useScroll(liRef);

  const [timeoutId, setTimeoutId] = useState();

  const actions = React.Children.toArray(children).filter(
    child => child.type === Actions
  );
  const [actionsLeft, actionsRight] = actions;

  const gutters = React.Children.toArray(children).filter(
    child => child.type === Gutter
  );
  const [gutterLeft, gutterRight] = gutters;

  const scrollToMiddle = useCallback(
    ({ smooth } = {}) => {
      const offsetWidth =
        wrapRef.current.offsetWidth - liRef.current.offsetWidth;
      const left = offsetWidth / 2;
      liRef.current.scrollTo({
        top: 0,
        left,
        behavior: smooth ? "smooth" : undefined
      });
    },
    [liRef, wrapRef]
  );

  const resetTimeout = useCallback(() => {
    clearTimeout(timeoutId);
    setTimeoutId(undefined);
  }, [timeoutId]);

  const onUndo = useCallback(() => {
    resetTimeout();
    scrollToMiddle({ smooth: true });
  }, [resetTimeout, scrollToMiddle]);

  const undoProps = {
    onUndo,
    index,
    item
  };

  const clonedGutterRight =
    gutterRight && React.cloneElement(gutterRight, undoProps);

  const clonedGutterLeft =
    gutterLeft && React.cloneElement(gutterLeft, undoProps);

  const inner = React.Children.toArray(children).filter(
    child => ![Actions, Gutter].includes(child.type)
  );

  const onDismissWithIndex = useCallback(() => {
    if (onDismiss) onDismiss(index, item);
  }, [onDismiss, index, item]);

  const onDismissWithIndexAndTimeout = useCallback(() => {
    if (timeoutId) return;
    if (onDismissStart) onDismissStart();
    setTimeoutId(
      setTimeout(() => {
        onDismissWithIndex();
      }, timeoutForDismiss)
    );
  }, [onDismissStart, onDismissWithIndex, timeoutId, timeoutForDismiss]);

  const actionsProps = {
    onDismiss: onDismissWithIndex,
    index,
    item
  };

  const clonedActionsLeft =
    actionsLeft && React.cloneElement(actionsLeft, actionsProps);

  const clonedActionsRight =
    actionsRight && React.cloneElement(actionsRight, actionsProps);

  useUpdateEffect(() => {
    const atMaxScroll =
      x === 0 || Math.abs(x / 2 - liRef.current.offsetWidth) < 4;
    if (atMaxScroll) onDismissWithIndexAndTimeout();
    else if (timeoutId) resetTimeout();
  }, [x]);

  useEffect(() => {
    scrollToMiddle();
  }, [width, height, scrollToMiddle]);

  return (
    <li ref={liRef}>
      <div ref={wrapRef} className="inner-wrap">
        <div className="inner-side inner-side-left inner-left">
          {clonedGutterLeft && (
            <div className="inner-gutter">
              <div>{clonedGutterLeft}</div>
            </div>
          )}
        </div>
        {clonedActionsLeft && (
          <div className="inner-actions inner-left-actions inner-left">
            {clonedActionsLeft}
          </div>
        )}
        <div className="inner">
          <div>{inner}</div>
        </div>
        {clonedActionsRight && (
          <div className="inner-actions inner-right-actions inner-right">
            {clonedActionsRight}
          </div>
        )}
        <div className="inner-side inner-side-right inner-right">
          {clonedGutterRight && (
            <div className="inner-gutter">
              <div>{clonedGutterRight}</div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

const Buttons = ({ children }) => (
  <div style={{ display: "flex", height: "100%" }}>{children}</div>
);

const Button = ({ children, ...restProps }) => (
  <button
    style={{
      background: "transparent",
      border: "none",
      fontSize: "1.5em",
      padding: "1em"
    }}
    {...restProps}
  >
    {children}
  </button>
);

const showSettings = () => alert("Settings...");
const showReply = () => alert("Replying...");

const appUndo = ({ onUndo }) => (
  <Button onClick={onUndo}>
    <MdUndo />
  </Button>
);

const animationTime = 1000;

const AppListItem = ({ item, index, onDismiss }) => {
  const [isDismissing, setIsDismissing] = useState(false);

  const onDismissWithAnimation = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, animationTime);
  }, [setIsDismissing, onDismiss]);

  return (
    <CSSTransition
      key={item}
      in={isDismissing}
      timeout={animationTime}
      classNames="dismiss"
    >
      <ListItem onDismiss={onDismissWithAnimation} index={index} item={item}>
        <Gutter>{appUndo}</Gutter>
        <Actions>
          <Buttons>
            <Button>
              ︎<MdSettings onClick={showSettings} />
            </Button>
            <Button>
              <MdReply onClick={showReply} />
            </Button>
          </Buttons>
        </Actions>
        {item}
        <Actions>
          {({ onDismiss }) => (
            <Buttons>
              <Button onClick={onDismiss}>
                <MdDelete />
              </Button>
            </Buttons>
          )}
        </Actions>
        <Gutter>{appUndo}</Gutter>
      </ListItem>
    </CSSTransition>
  );
};

function App() {
  const [list, setList] = useState([
    "One list item",
    "After another",
    "And even more",
    "Plus additional"
  ]);

  const onDismiss = useCallback(
    index => {
      const newList = [...list];
      newList.splice(index, 1);
      setList(newList);
    },
    [list]
  );

  return (
    <div className="App">
      <ul>
        {list.map((item, index) => (
          <AppListItem item={item} index={index} onDismiss={onDismiss} />
        ))}
      </ul>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
