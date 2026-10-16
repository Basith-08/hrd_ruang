begin;

update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct mime_type)
  from unnest(
    coalesce(allowed_mime_types, '{}'::text[]) || array[
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ) as mime_type
)
where id = 'candidate-documents'
  and allowed_mime_types is not null;

commit;
