import React from 'react';

interface ComponentWithStateProps {
  state: boolean;
  children: React.ReactNode;
}

export const ComponentWithState = ({ children }: ComponentWithStateProps) => {
  return <>{children}</>;
};

export const RenderComponentByState: React.FC<{ children: React.ReactElement<ComponentWithStateProps>[] }> = ({
  children,
}) => {
  let componentToRender: React.ReactNode = null;
  React.Children.forEach(children, component => {
    if (component.props.state && !componentToRender) {
      componentToRender = component.props.children;
    }
  });
  return <>{componentToRender}</>;
};
