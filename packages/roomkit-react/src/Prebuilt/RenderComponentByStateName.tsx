import React from 'react';

interface ComponentWithStateNameProps {
  state: string;
  children: React.ReactNode;
}

export const ComponentWithStateName = ({ children }: ComponentWithStateNameProps) => {
  return <>{children}</>;
};

export const RenderComponentByStateName: React.FC<{
  state: string;
  children: React.ReactElement<ComponentWithStateNameProps>[];
}> = ({ children, state }) => {
  let componentToRender: React.ReactNode = null;
  React.Children.forEach(children, component => {
    if (component.props.state === state && !componentToRender) {
      componentToRender = component.props.children;
    }
  });
  return <>{componentToRender}</>;
};
