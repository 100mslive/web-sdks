// import { HMSPrebuilt } from 'ssss-roomkit-react';
// "ssss-roomkit-react": "^0.0.5",

export const meta = () => {
  return [{ title: 'Prebuilt Remix' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  return (
    <div style={{ backgroundColor: 'black', height: '100vh', width: '100vw' }}>
      {/* <HMSPrebuilt
        themeConfig={{
          aspectRatio: '4-3',
          theme: 'dark',
          color: 'red',
          logo: '',
          font: '',
        }}
        roomCode="tjq-olkm-aih"
        endPoints={{
          token: 'https://auth-nonprod.100ms.live/v2/token',
          init: `https://dev-init.100ms.live/init`,
        }}
      /> */}
    </div>
  );
}
