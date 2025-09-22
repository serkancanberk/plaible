import React from 'react';
import ModalWrapper from '../components/ModalWrapper';
import C2AButton from '../components/C2AButton';

export default function ModalVariantsPreview() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-[10px] py-[12px] px-[24px] gap-[12px] bg-accent text-text-primary font-semibold text-body transition-colors hover:bg-accent/80"
      >
        Open: Start To Play Now
      </button>

      <ModalWrapper
        open={open}
        onClose={() => setOpen(false)}
        title="Start To Play Now"
        subtitle="Get in the story"
      >
        <div className="text-body mb-spacing-md">Your first chapter is free—your adventure begins now.</div>

        <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
          <button className="w-full bg-white text-primary font-semibold rounded-[8px] py-[12px] text-body inline-flex items-center justify-center">Continue with Google</button>
          <C2AButton variant="secondary" context="onAccent" fullWidth>
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
      </ModalWrapper>
    </div>
  );
}


