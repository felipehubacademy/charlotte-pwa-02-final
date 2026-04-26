-- Fix: user_vocabulary_insert trigger usando colunas nomeadas
-- O INSERT VALUES (NEW.*) posicional falha quando o app nao envia os campos SM-2
-- (ease_factor, interval_days, etc.) — o NULL sobrescreve os DEFAULT da tabela.
-- Solucao: usar COALESCE para preservar os defaults quando o valor nao foi enviado.

CREATE OR REPLACE FUNCTION public.user_vocabulary_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO charlotte.user_vocabulary (
    id,
    user_id,
    term,
    definition,
    example,
    example_translation,
    phonetic,
    category,
    source,
    created_at,
    ease_factor,
    interval_days,
    repetitions,
    next_review_at,
    last_reviewed_at,
    last_rating
  ) VALUES (
    COALESCE(NEW.id,                  gen_random_uuid()),
    NEW.user_id,
    NEW.term,
    COALESCE(NEW.definition,          ''),
    COALESCE(NEW.example,             ''),
    COALESCE(NEW.example_translation, ''),
    COALESCE(NEW.phonetic,            ''),
    COALESCE(NEW.category,            'word'),
    COALESCE(NEW.source,              'manual'),
    COALESCE(NEW.created_at,          now()),
    COALESCE(NEW.ease_factor,         2.5),
    COALESCE(NEW.interval_days,       0),
    COALESCE(NEW.repetitions,         0),
    COALESCE(NEW.next_review_at,      now()),
    NEW.last_reviewed_at,
    NEW.last_rating
  );
  RETURN NEW;
END $$;
