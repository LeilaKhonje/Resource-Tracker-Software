import {Body, Controller, HttpCode, HttpStatus, Post,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already exists' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],
        properties:{
          firstName:{
            type: 'string',
            example: 'John'
          },
          lastName:{
            type: 'string',
            example: 'Doe'
          },
          email:{
            type: 'string',
            example: 'johndoe@company.com'
          },
          password:{
            type: 'string',
            example: 'password123'
          }
        }
    }
  })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
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
}
