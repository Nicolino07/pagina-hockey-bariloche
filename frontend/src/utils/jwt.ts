export type JwtPayload = {
  sub: string
  username: string
  rol: string
  exp: number
}

export function decodeJwt(token: string): JwtPayload {
  const payloadBase64 = token.split(".")[1]
  const payloadJson = atob(payloadBase64)
  return JSON.parse(payloadJson) as JwtPayload
}
