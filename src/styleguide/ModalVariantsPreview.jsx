import React from 'react';
import BaseModal from '../components/ui/BaseModal';
import GetTheAppModal from '../components/ui/GetTheAppModal';
import C2AButton from '../components/C2AButton';

export default function ModalVariantsPreview() {
  const [openAccent, setOpenAccent] = React.useState(false);
  const [openPlain, setOpenPlain] = React.useState(false);
  const [openGetApp, setOpenGetApp] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-spacing-md">
        <button
          type="button"
          onClick={() => setOpenAccent(true)}
          className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
        >
          Open: Accent (Start To Play Now)
        </button>

        <button
          type="button"
          onClick={() => setOpenPlain(true)}
          className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
        >
          Open: Plain Modal
        </button>

        <button
          type="button"
          onClick={() => setOpenGetApp(true)}
          className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
        >
          Open: Get The App Modal
        </button>
      </div>

      <BaseModal
        open={openAccent}
        onClose={() => setOpenAccent(false)}
        title="START TO PLAY NOW"
        subtitle="Get in the story"
        variant="accent"
      >
        <div className="text-body mb-spacing-md">Your first chapter is free—your adventure begins now.</div>

        <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
          <C2AButton icon="google" variant="secondary" context="onAccent" fullWidth>
            Continue with Google
          </C2AButton>
          {/* Hidden temporarily */}
          <button className="hidden w-full bg-white text-primary font-semibold rounded-[8px] py-[12px] text-body inline-flex items-center justify-center">Continue with Apple</button>
          <button className="hidden w-full bg-white text-primary font-semibold rounded-[8px] py-[12px] text-body inline-flex items-center justify-center">Continue with X</button>
        </div>

        <div className="space-y-spacing-xs">
          <p className="text-caption">
            By continuing you agree to the <a href="#" className="underline text-primary">Terms Of Use</a> and <a href="#" className="underline text-primary">Privacy Policy</a>.
          </p>
          <p className="text-caption">
            Find all details in the <a href="#" className="underline text-primary">Legal</a> page.
          </p>
        </div>
      </BaseModal>

      <BaseModal
        open={openPlain}
        onClose={() => setOpenPlain(false)}
        title="Plain Variant Modal"
        subtitle="Neutral container"
        variant="plain"
      >
        <div className="text-body">This is a plain modal suitable for general content.</div>
      </BaseModal>

      <GetTheAppModal open={openGetApp} onClose={() => setOpenGetApp(false)} />
    </div>
  );
}


