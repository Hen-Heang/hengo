export function getOwnerPassword() {
  return process.env.OWNER_PASSWORD ?? process.env.ADMIN_PASSWORD;
}

export function getOwnerSecret() {
  return process.env.OWNER_SECRET ?? process.env.ADMIN_SECRET;
}
