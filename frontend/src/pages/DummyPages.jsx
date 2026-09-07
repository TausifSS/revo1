import React from "react";

function GenericPage({ title, description }) {
  return (
    <div className="min-h-screen bg-bg-light pt-32 pb-20 px-6">
      <div className="max-w-[800px] mx-auto bg-bg-white border border-border-color rounded-3xl p-10 shadow-sm text-center">
        <h1 className="text-4xl font-extrabold text-text-dark mb-4">{title}</h1>
        <p className="text-lg text-text-gray">{description}</p>
        <div className="mt-10 p-8 border border-dashed border-border-color rounded-2xl bg-bg-light">
          <p className="text-text-gray font-medium">Page content coming soon.</p>
        </div>
      </div>
    </div>
  );
}

export function Careers() {
  return <GenericPage title="Careers" description="Join our team and help us build the future of travel." />;
}

export function Terms() {
  return <GenericPage title="Terms of Service" description="Read our terms and conditions." />;
}

export function HelpCenter() {
  return <GenericPage title="Help Center" description="Find answers to your questions and get support." />;
}

export function Support() {
  return <GenericPage title="Support" description="Get in touch with our customer support team." />;
}

export function Privacy() {
  return <GenericPage title="Privacy Policy" description="Learn how we handle your personal data and protect your privacy." />;
}
