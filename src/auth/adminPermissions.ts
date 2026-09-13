export const adminPermissions = {
  users: { read: "users.read", manage: "users.manage" },
  roles: { read: "roles.read", create: "roles.create", update: "roles.update", delete: "roles.delete", restore: "roles.restore", manage: "roles.manage" },
  rolePermissions: { read: "role_permissions.read", update: "role_permissions.update", manage: "role_permissions.manage" },
  userRoles: { read: "user_roles.read", update: "user_roles.update", manage: "user_roles.manage" },
  pages: { read: "pages.read", create: "pages.create", update: "pages.update", archive: "pages.archive", delete: "pages.delete", restore: "pages.restore", manage: "pages.manage" },
  pageBlocks: { read: "page_blocks.read", manage: "page_blocks.manage" },
  pageTemplates: { read: "page_templates.read", create: "page_templates.create", update: "page_templates.update", archive: "page_templates.archive", delete: "page_templates.delete", restore: "page_templates.restore", manage: "page_templates.manage" },
  pagePresets: { read: "page_presets.read", create: "page_presets.create", update: "page_presets.update", delete: "page_presets.delete", manage: "page_presets.manage" },
  talentPages: { read: "talent_pages.read", create: "talent_pages.create", update: "talent_pages.update", manage: "talent_pages.manage" },
  talentTrees: { read: "talent_trees.read", update: "talent_trees.update", manage: "talent_trees.manage" },
  navigation: { read: "navigation.read", create: "navigation.create", update: "navigation.update", delete: "navigation.delete", restore: "navigation.restore", manage: "navigation.manage" },
  banners: { read: "banners.read", create: "banners.create", update: "banners.update", archive: "banners.archive", delete: "banners.delete", restore: "banners.restore", manage: "banners.manage" },
  footer: { read: "footer.read", create: "footer.create", update: "footer.update", archive: "footer.archive", delete: "footer.delete", restore: "footer.restore", manage: "footer.manage" },
  seo: { read: "seo.read", create: "seo.create", update: "seo.update", archive: "seo.archive", delete: "seo.delete", restore: "seo.restore", manage: "seo.manage" },
  localization: { read: "localization.read", create: "localization.create", update: "localization.update", archive: "localization.archive", delete: "localization.delete", restore: "localization.restore", manage: "localization.manage" },
  database: { read: "database.read" },
  media: { read: "media.read", update: "media.update", delete: "media.delete", restore: "media.restore", manage: "media.manage" },
  categories: { read: "categories.read", create: "categories.create", update: "categories.update", delete: "categories.delete", restore: "categories.restore", manage: "categories.manage" },
  classes: { read: "classes.read", create: "classes.create", update: "classes.update", delete: "classes.delete", restore: "classes.restore", manage: "classes.manage" },
  tags: { read: "tags.read", create: "tags.create", update: "tags.update", delete: "tags.delete", restore: "tags.restore", manage: "tags.manage" },
  patches: { read: "patches.read", create: "patches.create", update: "patches.update", delete: "patches.delete", restore: "patches.restore", manage: "patches.manage" },
  rarities: { read: "rarities.read", create: "rarities.create", update: "rarities.update", delete: "rarities.delete", restore: "rarities.restore", manage: "rarities.manage" },
  recordTypes: { read: "record_types.read", create: "record_types.create", update: "record_types.update", delete: "record_types.delete", manage: "record_types.manage" },
  spellIcons: { read: "spell_icons.read", create: "spell_icons.create", manage: "spell_icons.manage" },
  spells: { read: "spells.read", create: "spells.create", update: "spells.update", delete: "spells.delete", manage: "spells.manage" },
  items: { read: "items.read", create: "items.create", update: "items.update", delete: "items.delete", manage: "items.manage" },
  carts: { read: "carts.read", manage: "carts.manage" },
  products: { read: "products.read", create: "products.create", update: "products.update", delete: "products.delete", manage: "products.manage" },
  productReviews: { delete: "product_reviews.delete", manage: "product_reviews.manage" },
  promoCodes: { read: "promo_codes.read", create: "promo_codes.create", update: "promo_codes.update", manage: "promo_codes.manage" },
} as const;

export function hasEffectivePermission(
  permissions: readonly string[],
  permission: string,
): boolean {
  return permissions.includes(permission);
}

export function hasAnyEffectivePermission(
  permissions: readonly string[],
  required: readonly string[],
): boolean {
  return required.some((permission) => permissions.includes(permission));
}

export function canEnterAdmin(permissions: readonly string[]): boolean {
  return permissions.length > 0;
}
