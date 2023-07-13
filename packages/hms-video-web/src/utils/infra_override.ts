const keyOverride = 'override';

export interface InfraOverride {
  join: {
    sfu: {
      node_id: string;
    };
  };
}

function loadOverride(): InfraOverride | undefined {
  const override = localStorage.getItem(keyOverride);
  if (!override) {
    return undefined;
  }

  const val = JSON.parse(override) as InfraOverride;
  console.log(`InfraOverride: ${JSON.stringify(val, null, 2)}`);
  return val;
}

export const override = loadOverride();
