/**
 * Valida se a senha corresponde ao tipo de usuário selecionado.
 * 
 * Regras Simplificadas:
 * - Geral: Mínimo 6 caracteres (exigência do Firebase).
 * - Admin: Não pode ser puramente numérica.
 * - Empresa/Cliente/Prestador: Aceita alfanumérico ou numérico, desde que >= 6 chars.
 * 
 * @param password A senha digitada
 * @param accountType O tipo de conta selecionado ('client', 'company', 'admin', 'provider')
 * @returns Objeto com { valid: boolean, message: string }
 */
export const checkPasswordRole = (password: string, accountType: string): { valid: boolean; message: string } => {
    const p = password;
  
    // 1. Regra Universal: Mínimo 6 caracteres
    // O Firebase Auth recusa senhas menores que 6 caracteres com o erro 'auth/weak-password'.
    if (p.length < 6) {
        return { valid: false, message: 'A senha deve ter no mínimo 6 caracteres.' };
    }
    
    // 2. Regra Admin: Mais segurança (não pode ser puramente numérica)
    if (accountType === 'admin') {
       const isNumeric = /^[0-9]+$/.test(p);
       if (isNumeric) {
          return { valid: false, message: 'A senha de Administrador deve conter letras (não pode ser apenas números).' };
       }
    }
  
    // 3. Empresa, Cliente e Prestador:
    // Removemos a restrição de "complexidade" para evitar o erro "muito simples" que bloqueava o cadastro.
    // Agora, basta ter 6 caracteres.
  
    return { valid: true, message: '' };
  };