-- Política para permitir usuários inserirem seus próprios achievements
CREATE POLICY "Users can insert own achievements" ON user_achievements
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_achievements'; 