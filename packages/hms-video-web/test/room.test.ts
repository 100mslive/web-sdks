import { getRoomId } from '../src/utils/room';

describe('getRoomId', () => {
  it('should return roomId from an authToken', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUyIiwiYXBwX2lkIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUxIiwicm9vbV9pZCI6IjVmY2I0ZGY2YjQ5MjQxOWE5ODVhYjIzYSIsInVzZXJfaWQiOiJhMDVmZWEzZC03YmNhLTRhY2ItODQ1Ny1mZjliZTM4NjIwMDlFZGxhIiwicm9sZSI6Ikhvc3QiLCJpYXQiOjE2MTg0NzgyMzksImV4cCI6MTYxODU2NDYzOSwiaXNzIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGRmIiwianRpIjoiZjE0OTZhNmQtMjllYy00ZGVhLWI0YmItNzZkMjcxOGY0NDJkIn0.YsBSyt52cdRfYDSeDEm-FRc4wL792eXM6PFHMtrp6i4';
    expect(getRoomId(token)).toEqual('5fcb4df6b492419a985ab23a');
  });
});
