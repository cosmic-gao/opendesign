import React from "react";
import { TypeAnimation } from "react-type-animation";

function TypableInner({ text, createdAt }: { text: string; createdAt: Date }) {
  if (new Date(createdAt).getTime() < Date.now() - 2000) {
    return text;
  }

  return (
    <TypeAnimation
      splitter={(str) => str.split(/(?= )/)} // 'Lorem ipsum dolor' -> ['Lorem', ' ipsum', ' dolor']
      sequence={[text, 3000]}
      speed={{ type: "keyStrokeDelayInMs", value: 30 }}
      omitDeletionAnimation={true}
      cursor={false}
      repeat={0}
    />
  );
}

export const Typable = React.memo(TypableInner, (prev, next) => {
  return prev.text === next.text;
});
