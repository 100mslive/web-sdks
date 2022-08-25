import * as React from 'react';

function SvgGoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M20.299 12.157c0-.697-.057-1.205-.179-1.732h-7.954v3.144h4.669c-.094.781-.603 1.958-1.732 2.749l-.016.105 2.515 1.948.174.018c1.6-1.478 2.523-3.653 2.523-6.232z"
        fill="#4285F4"
      />
      <path
        d="M12.167 20.441c2.287 0 4.208-.753 5.61-2.052l-2.673-2.07c-.715.498-1.676.846-2.937.846-2.24 0-4.142-1.478-4.82-3.52l-.1.008-2.614 2.024-.034.095a8.466 8.466 0 007.568 4.67z"
        fill="#34A853"
      />
      <path
        d="M7.347 13.645a5.216 5.216 0 01-.283-1.676c0-.583.104-1.148.273-1.675l-.005-.113-2.647-2.056-.087.041a8.48 8.48 0 00-.904 3.803c0 1.365.33 2.655.905 3.803l2.748-2.127z"
        fill="#FABB05"
      />
      <path
        d="M12.167 6.773c1.59 0 2.664.687 3.276 1.261l2.39-2.334c-1.468-1.365-3.379-2.203-5.666-2.203a8.467 8.467 0 00-7.57 4.67l2.74 2.127c.687-2.043 2.59-3.521 4.83-3.521z"
        fill="#E94235"
      />
    </svg>
  );
}

export default SvgGoogleIcon;
