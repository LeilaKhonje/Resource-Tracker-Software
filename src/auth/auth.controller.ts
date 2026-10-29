import {Body, Controller, HttpCode, HttpStatus, Post,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully', schema: { type: 'object', properties: { accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } }, required: ['accessToken'] } })
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
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Request a password reset' })
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
}
