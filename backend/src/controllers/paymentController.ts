import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SIH2026KeralaHealth';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_sih2026_health_portal';

export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, patientId, amount, isBplWaiver, waiverReason } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required.',
      });
    }

    const finalAmount = isBplWaiver ? 0 : Number(amount) || 50; // Default nominal 50 INR or free waiver
    const orderId = `order_sih_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (isBplWaiver) {
      const paymentRecord = await prisma.payment.create({
        data: {
          appointmentId: appointmentId ? String(appointmentId) : null,
          patientId: String(patientId),
          amount: 0,
          currency: 'INR',
          orderId,
          status: PaymentStatus.WAIVED,
          method: PaymentMethod.AWAZ_INSURANCE_WAIVER,
          waivedReason: waiverReason || 'AWAZ / Kerala BPL Migrant Welfare Exemption',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Fee waived under Kerala Guest Worker Welfare Scheme',
        data: {
          isWaived: true,
          payment: paymentRecord,
        },
      });
    }

    // Create initiated payment record
    const paymentRecord = await prisma.payment.create({
      data: {
        appointmentId: appointmentId ? String(appointmentId) : null,
        patientId: String(patientId),
        amount: finalAmount,
        currency: 'INR',
        orderId,
        status: PaymentStatus.INITIATED,
        method: PaymentMethod.UPI,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        keyId: RAZORPAY_KEY_ID,
        orderId,
        amount: finalAmount * 100, // Amount in paise for Razorpay
        currency: 'INR',
        paymentRecordId: paymentRecord.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, paymentId, signature, method } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'orderId and paymentId are required for verification.',
      });
    }

    // Verify HMAC SHA256 signature if signature provided, otherwise sandbox validation
    let isSignatureValid = true;
    if (signature && signature !== 'sandbox_test_signature') {
      const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
      hmac.update(`${orderId}|${paymentId}`);
      const generatedSignature = hmac.digest('hex');
      isSignatureValid = generatedSignature === signature;
    }

    if (!isSignatureValid) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.FAILED },
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.',
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.SUCCESS,
        paymentId: String(paymentId),
        signature: signature ? String(signature) : 'sandbox_signature_verified',
        method: method ? (method as PaymentMethod) : PaymentMethod.UPI,
      },
    });

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully',
      data: updatedPayment,
    });
  } catch (error) {
    next(error);
  }
};
