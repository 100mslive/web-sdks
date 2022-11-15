import decodeJWT from './jwt';
import { HMSException } from '../error/HMSException';

const validToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUyIiwiYXBwX2lkIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUxIiwicm9vbV9pZCI6IjVmY2I0ZGY2YjQ5MjQxOWE5ODVhYjIzYSIsInVzZXJfaWQiOiJhMDVmZWEzZC03YmNhLTRhY2ItODQ1Ny1mZjliZTM4NjIwMDlFZGxhIiwicm9sZSI6Ikhvc3QiLCJpYXQiOjE2MTg0NzgyMzksImV4cCI6MTYxODU2NDYzOSwiaXNzIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGRmIiwianRpIjoiZjE0OTZhNmQtMjllYy00ZGVhLWI0YmItNzZkMjcxOGY0NDJkIn0.YsBSyt52cdRfYDSeDEm-FRc4wL792eXM6PFHMtrp6i4';

describe('decodeJWT', () => {
  const expectToBeTerminalException = (error: any) => {
    expect(error).toBeInstanceOf(HMSException);
    expect(error.isTerminal).toEqual(true);
  };

  it('should return roomId from an authToken', () => {
    expect(decodeJWT(validToken).roomId).toEqual('5fcb4df6b492419a985ab23a');
  });

  it('should return role from an authToken', () => {
    expect(decodeJWT(validToken).role).toEqual('Host');
  });

  it('should throw HMSException when authToken is empty', () => {
    try {
      decodeJWT('');
    } catch (e) {
      expectToBeTerminalException(e);
      expect((e as HMSException).message).toContain('Token is not in proper JWT format');
    }
  });

  it('should throw HMSException when authToken is invalid', () => {
    try {
      decodeJWT(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUyIiwiYXBwX2lkIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGUxIiwicm9vbV9pZCI6IjVmY2I0ZGY2YjQ5MjQxOWE5ODVhYjIzYSIsInVzZXJfaWQiOiJhMDVmZWEzZC03YmNhLTRhY2ItODQ1Ny1mZjliZTM4NjIwMDlFZGxhIiwicm9sZSI6Ikhvc3QiLCJpYXQiOjE2MTg0NzgyMzksImV4cCI6MTYxODU2NDYzOSwiaXNzIjoiNWY5ZWRjNmJkMjM4MjE1YWVjNzcwMGRmIiwianRpIjoiZjE0OTZhNmQtMjllYy00ZGVhLWI0YmItNz',
      );
    } catch (e) {
      expectToBeTerminalException(e);
      expect((e as HMSException).message).toContain('Token is not in proper JWT format');
    }
  });
});
