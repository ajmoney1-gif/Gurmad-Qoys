import test from 'node:test';
import assert from 'node:assert/strict';
import { filterReports } from './filterReports.ts';
import { PersonReport } from '../types/index.ts';

const mockReports: PersonReport[] = [
  {
    id: '1',
    name: 'Cali Goobe',
    age: 28,
    category: 'Qof weyn',
    location: 'Deyniile',
    lastSeen: '16 Oct 2026',
    description: 'Funaanad jaalle ah',
    phone: '0615000000',
    reportType: 'Warbixin la soo gudbiyey',
    status: 'active',
    createdAt: new Date().toISOString(),
    likesCount: 1,
    commentsCount: 1,
  },
  {
    id: '2',
    name: 'Deeqa Axmed',
    age: 7,
    category: 'Ilmo',
    location: 'Hodan',
    lastSeen: '17 Oct 2026',
    description: 'Dharka dugsiga',
    phone: '0615111111',
    reportType: 'Warbixin la soo gudbiyey',
    status: 'found',
    createdAt: new Date().toISOString(),
    likesCount: 5,
    commentsCount: 2,
  },
];

test('filterReports filters by category', () => {
  const children = filterReports(mockReports, { category: 'Ilmo' });
  assert.equal(children.length, 1);
  assert.equal(children[0].name, 'Deeqa Axmed');
});

test('filterReports filters by search query on location or name', () => {
  const searchResult = filterReports(mockReports, { query: 'deyniile' });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].name, 'Cali Goobe');
});

test('filterReports filters by status', () => {
  const found = filterReports(mockReports, { status: 'found' });
  assert.equal(found.length, 1);
  assert.equal(found[0].name, 'Deeqa Axmed');
});
