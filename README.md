# LOTO INTELIGENTE — v0.3.0

## O que esta versão inclui
- Interface dark responsiva.
- Login e cadastro por e-mail/senha com Supabase Auth.
- Sessão persistente.
- Salvamento, carregamento e exclusão de jogos na nuvem, vinculados ao usuário autenticado.
- Chave publicável e URL configuradas em `config.js`.

## Antes de publicar
1. No Supabase, confirme que as tabelas `lotteries`, `draws`, `saved_games` e `game_checks` existem.
2. Abra SQL Editor e execute `supabase-schema-v0.3.sql` para garantir o catálogo e as políticas RLS.
3. Em Authentication → URL Configuration, configure a URL do seu site Netlify em Site URL e Redirect URLs.
4. Em Authentication → Providers → Email, mantenha Email habilitado. Se confirmação de e-mail estiver ativa, o usuário precisará confirmar o endereço antes do primeiro login.
5. Publique o conteúdo desta pasta no Netlify.

## Configuração Supabase
A URL e a publishable key estão em `config.js`. A publishable key pode ser usada no navegador. **Nunca coloque `sb_secret_`, `service_role` ou a senha do banco em arquivos do site.**

## Limitações desta versão
- Os jogos numéricos compatíveis são gerados localmente e salvos na conta.
- Modalidades com regras especiais ainda não têm gerador/conferência específicos.
- Ainda não há importação automática de resultados oficiais nem estatísticas históricas reais.
- Não há previsão de sorteios; frequências passadas não alteram probabilidades futuras.

## Publicação
Envie os arquivos desta pasta para o deploy do Netlify. `index.html` deve ficar na raiz publicada.
