import { ChocoboCard } from './types';

export const initialChocoboCards: ChocoboCard[] = Array.from({ length: 77 }, (_, i) => ({
  id: i + 1,
  name: `Golden Chocobo #${(i + 1).toString().padStart(2, '0')}`,
  found: false,
  image: `/images/chocobo-${(i + 1).toString().padStart(2, '0')}.jpg`, // Placeholder image paths
}));

export const chocoboNames = [
  "Golden Chocobo #01", "Golden Chocobo #02", "Golden Chocobo #03", "Golden Chocobo #04", "Golden Chocobo #05",
  "Golden Chocobo #06", "Golden Chocobo #07", "Golden Chocobo #08", "Golden Chocobo #09", "Golden Chocobo #10",
  "Golden Chocobo #11", "Golden Chocobo #12", "Golden Chocobo #13", "Golden Chocobo #14", "Golden Chocobo #15",
  "Golden Chocobo #16", "Golden Chocobo #17", "Golden Chocobo #18", "Golden Chocobo #19", "Golden Chocobo #20",
  "Golden Chocobo #21", "Golden Chocobo #22", "Golden Chocobo #23", "Golden Chocobo #24", "Golden Chocobo #25",
  "Golden Chocobo #26", "Golden Chocobo #27", "Golden Chocobo #28", "Golden Chocobo #29", "Golden Chocobo #30",
  "Golden Chocobo #31", "Golden Chocobo #32", "Golden Chocobo #33", "Golden Chocobo #34", "Golden Chocobo #35",
  "Golden Chocobo #36", "Golden Chocobo #37", "Golden Chocobo #38", "Golden Chocobo #39", "Golden Chocobo #40",
  "Golden Chocobo #41", "Golden Chocobo #42", "Golden Chocobo #43", "Golden Chocobo #44", "Golden Chocobo #45",
  "Golden Chocobo #46", "Golden Chocobo #47", "Golden Chocobo #48", "Golden Chocobo #49", "Golden Chocobo #50",
  "Golden Chocobo #51", "Golden Chocobo #52", "Golden Chocobo #53", "Golden Chocobo #54", "Golden Chocobo #55",
  "Golden Chocobo #56", "Golden Chocobo #57", "Golden Chocobo #58", "Golden Chocobo #59", "Golden Chocobo #60",
  "Golden Chocobo #61", "Golden Chocobo #62", "Golden Chocobo #63", "Golden Chocobo #64", "Golden Chocobo #65",
  "Golden Chocobo #66", "Golden Chocobo #67", "Golden Chocobo #68", "Golden Chocobo #69", "Golden Chocobo #70",
  "Golden Chocobo #71", "Golden Chocobo #72", "Golden Chocobo #73", "Golden Chocobo #74", "Golden Chocobo #75",
  "Golden Chocobo #76", "Golden Chocobo #77"
]; 