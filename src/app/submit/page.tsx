'use client';

import React, { useState } from 'react';
import Head from 'next/head';

export default function SubmitPage() {
  const [cardId, setCardId] = useState('');
  const [foundBy, setFoundBy] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardId,
        foundBy,
        dateFound,
        link,
      }),
    });

    if (response.ok) {
      setMessage('Submission successful!');
      setIsError(false);
      setCardId('');
      setFoundBy('');
      setDateFound('');
      setLink('');
    } else {
      setMessage('Submission failed.');
      setIsError(true);
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Report a Golden Chocobo Find",
    "description": "Submit information about discovered Golden Chocobo cards to help track the 77 serialized cards from MTG Final Fantasy",
    "url": "https://goldenchocobotracker.com/submit",
    "mainEntity": {
      "@type": "Form",
      "name": "Golden Chocobo Discovery Report",
      "description": "Form to report newly discovered Golden Chocobo cards"
    }
  };

  return (
    <>
      <Head>
        <title>Report a Find | Golden Chocobo Tracker</title>
        <meta name="description" content="Submit information about discovered Golden Chocobo cards to help track the 77 serialized cards from MTG Final Fantasy." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-chocobo-gold">Report a Find</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-lg bg-chocobo-dark p-8 rounded-lg border border-chocobo-gold">
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label className="block uppercase tracking-wide text-chocobo-gold text-xs font-bold mb-2" htmlFor="grid-state">
                Card ID
              </label>
              <div className="relative">
                <select
                  className="block appearance-none w-full bg-chocobo-light border border-chocobo-gold text-chocobo-dark py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white"
                  id="grid-state"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                >
                  <option value="">Select a card</option>
                  {Array.from({ length: 77 }, (_, i) => i + 1).map((id) => (
                    <option key={id} value={id}>
                      Golden Chocobo #{id}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-chocobo-dark">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label className="block uppercase tracking-wide text-chocobo-gold text-xs font-bold mb-2" htmlFor="found-by">
                Found By
              </label>
              <input
                className="appearance-none block w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                id="found-by"
                type="text"
                value={foundBy}
                onChange={(e) => setFoundBy(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label className="block uppercase tracking-wide text-chocobo-gold text-xs font-bold mb-2" htmlFor="date-found">
                Date Found
              </label>
              <input
                className="appearance-none block w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                id="date-found"
                type="date"
                value={dateFound}
                onChange={(e) => setDateFound(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label className="block uppercase tracking-wide text-chocobo-gold text-xs font-bold mb-2" htmlFor="link">
                Source Link
              </label>
              <input
                className="appearance-none block w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mt-6">
            <div className="w-full px-3">
              <button
                className="bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Submit
              </button>
            </div>
          </div>
          {message && <p className={`mt-4 text-center ${isError ? 'text-red-500' : 'text-green-400'}`}>{message}</p>}
        </form>
      </main>
    </>
  );
} 