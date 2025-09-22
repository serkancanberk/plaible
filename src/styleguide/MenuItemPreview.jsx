import React from 'react';
import MenuItem from '../components/MenuItem';

export default function MenuItemPreview() {
  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      <MenuItem label="Start to play now" href="#" />
      <MenuItem label="Get the app (Soon)" href="#" />
      <MenuItem label="Pay as you go" href="#" />
      <MenuItem label="Keep in touch" href="#" />
      <MenuItem label="Check legal stuffs" href="#" />
    </div>
  );
}


