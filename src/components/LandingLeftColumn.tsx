import React from 'react';
import PlaibleLogo from './PlaibleLogo';
import MenuItem from './MenuItem';
import StartToPlayNowModal from './ui/StartToPlayNowModal';
import GetTheAppModal from './ui/GetTheAppModal';
import PayAsYouGoModal from './ui/PayAsYouGoModal';
import KeepInTouchModal from './ui/KeepInTouchModal';
import CheckLegalStuffModal from './ui/CheckLegalStuffModal';

type Props = {
  openStartModal: () => void;
};

const LandingLeftColumn: React.FC<Props> = ({ openStartModal }) => {
  const [openStart, setOpenStart] = React.useState(false);
  const [openGetApp, setOpenGetApp] = React.useState(false);
  const [openPay, setOpenPay] = React.useState(false);
  const [openKeep, setOpenKeep] = React.useState(false);
  const [openLegal, setOpenLegal] = React.useState(false);
  return (
    <aside className="md:h-screen md:flex md:flex-col md:justify-between px-spacing-2xl pt-spacing-xl md:pt-spacing-3xl pb-spacing-2xl md:pr-spacing-3xl bg-accent">
      <div className="flex flex-col md:h-full justify-between space-y-spacing-xl md:space-y-0">
        {/* Top (Logo) */}
        <div className="hidden md:block">
          <h1 className="text-subheading font-sans text-secondary text-left">
            <PlaibleLogo size="lg" />
          </h1>
        </div>

        {/* Center (Heading + Paragraph) */}
        <div className="flex-1 flex md:items-center">
          <div className="space-y-spacing-xl max-w-md md:max-w-sm">
            <h2 className="text-heading text-primary font-semibold">Live your own epic stories.</h2>
            <p className="text-body text-primary">Every word you type shapes and grows the story into a living world by your imagination and Plaible’s storyrunner AI. Forge the tale only you can dream up.</p>
            <p className="text-body text-primary"> </p>
          </div>
        </div>

        {/* Bottom (Nav links + Footer) */}
        <div className="space-y-spacing-xl hidden md:block md:mt-spacing-xl">
          <nav>
            <div className="space-y-spacing-sm">
              <MenuItem label="Start to play now" onClick={() => setOpenStart(true)} />
              <MenuItem label="Get the app (Soon)" onClick={() => setOpenGetApp(true)} />
              <MenuItem label="Pay as you go" onClick={() => setOpenPay(true)} />
              <MenuItem label="Keep in touch" onClick={() => setOpenKeep(true)} />
              <MenuItem label="Check legal stuffs" onClick={() => setOpenLegal(true)} />
            </div>
          </nav>
          <div className="pt-spacing-md">
            <p className="text-label text-secondary">© Plaible.com 2025</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StartToPlayNowModal open={openStart} onClose={() => setOpenStart(false)} />
      <GetTheAppModal open={openGetApp} onClose={() => setOpenGetApp(false)} />
      <PayAsYouGoModal open={openPay} onClose={() => setOpenPay(false)} />
      <KeepInTouchModal open={openKeep} onClose={() => setOpenKeep(false)} />
      <CheckLegalStuffModal open={openLegal} onClose={() => setOpenLegal(false)} />
    </aside>
  );
};

export default LandingLeftColumn;


