begin;

delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.name in (
    'pic_recruitment:create',
    'pic_recruitment:delete',
    'recruitment:pic_recruitment_create',
    'recruitment:pic_recruitment_delete'
  );

delete from public.permissions
where name in (
  'pic_recruitment:create',
  'pic_recruitment:delete',
  'recruitment:pic_recruitment_create',
  'recruitment:pic_recruitment_delete'
);

commit;
