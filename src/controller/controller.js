import { query } from 'express';
import { conexion } from '../model/conexion.js';
import jwt from 'jsonwebtoken'

const secret = process.env.SECRET || 'BITALA4'

export const getToken = async (req, res) => {
    try {
        const token = jwt.sign({
            sub,
            name,
            exp: Math.floor(Date.now() / 1000) + (60 * 3),
        }, secret)
        res.json({ token })

    } catch (error) {
        res.status(401).send({ error: error.message })
    }
}