export const meta = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  return (
    <div style={{ backgroundColor: 'black', height: '100vh', width: '100vw' }}>
      {/* <HMSPrebuilt
        themeConfig={{
          aspectRatio: '4-3',
          theme: 'dark',
          color: 'red',
          logo: logo,
          font: font,
        }}
        roomCode="tjq-olkm-aih"
        endPoints={{
          token: 'https://auth-nonprod.100ms.live/v2/token',

          init: `https://qa-init.100ms.live/init`,
        }}
      /> */}
    </div>
  );
}
