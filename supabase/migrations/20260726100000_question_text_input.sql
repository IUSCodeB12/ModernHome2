-- ---------------------------------------------------------------------------
-- Free-text question input.
--
-- The custom-job service needs a "describe the job" field, which none of the
-- existing input types cover. Postgres won't let a new enum value be used in
-- the same transaction that adds it, so this lives in its own migration and
-- the rows that use it are inserted by the next one.
-- ---------------------------------------------------------------------------

alter type public.question_input_type add value if not exists 'text';
