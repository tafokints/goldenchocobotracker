import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ChocoboCard } from '@/lib/types';

const dataFilePath = path.join(process.cwd(), 'src/lib/chocobo-data.json');

async function readData(): Promise<ChocoboCard[]> {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeData(data: ChocoboCard[]): Promise<void> {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  const submission = await request.json();
  const cards = await readData();

  const cardIndex = cards.findIndex(c => c.id === parseInt(submission.cardId));

  if (cardIndex === -1) {
    return NextResponse.json({ message: 'Card not found' }, { status: 404 });
  }

  cards[cardIndex] = {
    ...cards[cardIndex],
    found: true,
    foundBy: submission.foundBy,
    dateFound: submission.dateFound,
    link: submission.link,
  };

  await writeData(cards);

  return NextResponse.json({ message: 'Submission received' }, { status: 200 });
} 