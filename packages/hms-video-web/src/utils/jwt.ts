function jwt_decode(token: string) {
  return JSON.parse(atob(token.split('.')[1]));
}

export { jwt_decode };
