import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/firebase/firebase.service';
import { AuthService } from '../services/firebase/auth.service';
import { ApiError } from '../utils/apiError';

export const AuthController = {
  // Validação de registro unificada
    validateRegister(req: Request, res: Response, next: NextFunction) {
    const { email, name, phone, password } = req.body;
    
    // Verifica campos obrigatórios
    if (!email?.trim() || !name?.trim() || !password?.trim()) {
        return next(new ApiError(400, 'Email, nome e senha são obrigatórios'));
    }
    
    // Validação de email robusta
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
        return next(new ApiError(400, 'Formato de email inválido. Use o formato: usuario@dominio.com'));
    }

    // Validação de senha
    if (password.length < 6) {
        return next(new ApiError(400, 'A senha deve ter no mínimo 6 caracteres'));
    }
    
    // Validação opcional para mobile
    if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
        return next(new ApiError(400, 'Número de telefone inválido. Use o formato: +5511999999999'));
    }
    
    next();
  },

  // Registro mobile
  async registerMobile(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, phone } = req.body;

      // Validação adicional da senha
      if (password.length < 6) {
          throw new ApiError(400, 'A senha deve ter no mínimo 6 caracteres');
      }

      console.log('Iniciando registro para:', email);
      console.log('Dados recebidos:', { name, phone });
      
      const result = await AuthService.registerMobile(
        email, 
        password, 
        name, 
        phone, 
      );

      res.status(201).json({
        success: true,
        user: {
          uid: result.uid,
          email: result.email,
          name: result.name,
          phone: result.phone
        },
        token: result.idToken, // Token do Firebase
        refreshToken: result.refreshToken // Refresh token do Firebase
      });
    } catch (error) {
      console.error('Erro no controlador de registro:', error);
      next(error);
    }
  },

  // Validação de login unificada
  validateLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    
    if (!email?.trim() || !password?.trim()) {
      return next(new ApiError(400, 'Email e senha são obrigatórios'));
    }
    
    next();
  },

  // Login mobile
  async loginMobile(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.loginMobile(email, password);

      console.log('Login bem-sucedido para:', email); // Log adicional

      res.json({
        success: true,
        user: {
          uid: result.uid,
          email: result.email,
          name: result.name,
          phone: result.phone
        },
        token: result.idToken, // Token do Firebase
        refreshToken: result.refreshToken // Refresh token do Firebase
      });
    } catch (error) {
      console.error('Erro detalhado no login:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  },

  // Validação de token
  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      // O authMiddleware já validou o token
      // Podemos adicionar verificações adicionais se necessário
      const user = await auth.getUser(req.user?.uid || '');
      
      res.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          phone: user.phoneNumber
        },
        valid: true
      });
    } catch (error) {
      console.error('Erro na validação do token:', error);
      next(new ApiError(401, 'Token inválido ou expirado'));
    }
  },

  // Refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token é obrigatório');
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        token: result.idToken,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      console.error('Erro no refresh token:', error);
      next(new ApiError(401, 'Refresh token inválido ou expirado'));
    }
  },

  // Logout unificado
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('token');
      res.json({ 
        success: true,
        message: 'Logout realizado com sucesso' 
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      next(new ApiError(500, 'Erro durante logout'));
    }
  }
};