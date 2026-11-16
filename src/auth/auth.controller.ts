import {Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully', schema: { type: 'object', properties: { accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }, refreshToken: { type: 'string' } }, required: ['accessToken', 'refreshToken'] } })
  @ApiResponse({ status: 400, description: 'Invalid email or password field format' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid credentials' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['email', 'password'],
       properties:{
        email:{
          type: 'string',
          example:'johndoe@company.com'
        },
        password:{
          type: 'string',
          example:'password123'
        },
       },
    },
  })
  @Post('')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Obtain new tokens using a refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New access and refresh tokens issued',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
      required: ['accessToken', 'refreshToken'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is invalid, expired, or user is inactive',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Log out and revoke the current refresh token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Refresh token revoked' })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid, expired, or already revoked' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @ApiOperation({ summary: 'Forgot password, send a user the link to reset their password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset request accepted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If an account exists for this email, password reset instructions will be sent.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  @ApiBody({ type: ForgotPasswordDto })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('reset-password')
  @Header('Content-Type', 'text/html; charset=utf-8')
  resetPasswordPage(@Query('token') token = '') {
    const safeToken = token.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character] ?? character);
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reset password</title>
<style>body{font:16px system-ui,sans-serif;background:#f4f6f8;margin:0;min-height:100vh;display:grid;place-items:center}.card{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 8px 30px #15202b18;width:min(90vw,380px)}h1{font-size:1.5rem}label{display:block;margin:1rem 0 .35rem}input,button{box-sizing:border-box;width:100%;padding:.8rem;border:1px solid #aab4bf;border-radius:6px;font:inherit}button{margin-top:1.2rem;background:#174ea6;color:#fff;border:0;cursor:pointer}#status{min-height:1.5rem;margin-top:1rem}</style></head>
<body><main class="card"><h1>Reset your password</h1><p>Choose a new password with at least 8 characters.</p>
<form id="reset-form"><input id="token" type="hidden" value="${safeToken}"><label for="password">New password</label><input id="password" type="password" minlength="8" required autocomplete="new-password"><label for="confirm">Confirm new password</label><input id="confirm" type="password" minlength="8" required autocomplete="new-password"><button type="submit">Save new password</button></form><p id="status" role="status"></p></main>
<script>document.getElementById('reset-form').addEventListener('submit',async event=>{event.preventDefault();const status=document.getElementById('status');const password=document.getElementById('password').value;const confirm=document.getElementById('confirm').value;if(password!==confirm){status.textContent='The passwords do not match.';return}status.textContent='Saving…';try{const response=await fetch('/api/v1/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:document.getElementById('token').value,newPassword:password})});const result=await response.json();status.textContent=response.ok?'Password reset successfully. You can now sign in.':(result.message||'This reset link is invalid or expired.');if(response.ok)document.getElementById('reset-form').remove()}catch{status.textContent='Could not reach the server. Please try again.'}});</script></body></html>`;
  }
}
