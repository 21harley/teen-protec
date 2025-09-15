import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { desencriptar,encriptar, generarTokenExpiry } from "@/app/lib/crytoManager";
import { setImmediate } from 'timers/promises';
import { create_alarma_email,create_alarma } from '@/app/lib/alertas';

const prisma = new PrismaClient();

export async function POST(request: Request) {
   const { email, code , iv, newPassword} = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email o Code son requeridos' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { 
        tipo_usuario: true,
        adolecente: {
          include: {
            tutor: true
          }
        },
        psicologo: {
          include: {
            redes_sociales: true
          }
        },
        psicologoPacientes: true 
      }
    });
    if (!usuario) {
          return NextResponse.json(
            { error: 'Credenciales inválidas' },
            { status: 401 }
          );
    }
  try {
    if(email && !code && !iv && !newPassword){
        //Creando codigo
        let numeroCode = crypto.randomInt(100000,999999).toString();
        
        const codigo = encriptar(numeroCode);
        const resetPasswordToken = codigo.contenido;
        const resetPasswordTokenExpiry = generarTokenExpiry();

        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { 
                resetPasswordToken,
                resetPasswordTokenExpiry,
            }
        });

        //Enviar correo
        setImmediate().then(async () => {
            const result_email = await  create_alarma_email({
            id_usuario: usuario.id,
            id_tipo_alerta: 9,
            mensaje: "Recuperacion de contraseña",
            vista: false,
            correo_enviado: true,
            emailParams: {
                  to: usuario.email,
                  subject: "Se a creado un codigo de recuperacion de clave.",
                  template: "resetPassword",
                  props: {
                    code: numeroCode
                  }
                }
            });
     
            if (!result_email.emailSent) console.error('Error creando usuario',result_email); 
        });
        return NextResponse.json(
            { error: '  ', data: { iv: codigo.iv,message : "Revisar correo." } },
            { status: 200 }
        );
    }else if( email && code && iv && !newPassword){
        
        const codigo = desencriptar({
            iv: iv,
            contenido: usuario.resetPasswordToken || ""
        });
     

        if(code == codigo){
            return NextResponse.json(
                { error: '  ', data: { message : "valido codigo, ingrese nueva contraseña." } },
                { status: 200 }
            );
        }else{
            return NextResponse.json(
              { error: 'Error al ingresar codigo.' },
              { status: 400 }
            );
        }
        
    }else if ( email && code && iv && newPassword){
        const codigo = desencriptar({
            iv: iv,
            contenido: usuario.resetPasswordToken || ""
        });
     

        if(code == codigo){
            const contraseñaEncriptada = encriptar(newPassword);
            await prisma.usuario.update({
            where: { id: usuario.id },
                data: { 
                  password:contraseñaEncriptada.contenido,
                  password_iv:contraseñaEncriptada.iv,
                  resetPasswordToken:null,
                  resetPasswordTokenExpiry:null
                }
            });
            return NextResponse.json(
                { error: '  ', data: { message : "Cambio de clave completado" } },
                { status: 200 }
            );

        }else{

            return NextResponse.json(
              { error: 'Error al ingresar codigo, al ingresar una nueva clave.' },
              { status: 400 }
            );
        }
    }else{
        return NextResponse.json(
          { error: 'Error en los datos requeridos' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error en login:', error);
    
    if (error.message.includes('Error al desencriptar')) {
      return NextResponse.json(
        { error: 'Problema con las credenciales almacenadas' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

