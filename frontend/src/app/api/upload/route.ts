import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
const pdfParse = require('pdf-parse')

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
    }

    // Convert file to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text
    let extractedText = ''
    try {
      const data = await pdfParse(buffer)
      extractedText = data.text
    } catch (err) {
      console.error('Error parsing PDF:', err)
      return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 })
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const storagePath = `${user.id}/${timestamp}_${cleanFilename}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }

    // Insert into documents table
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        student_id: user.id,
        type,
        filename: file.name,
        storage_path: storagePath,
        extracted_text: extractedText,
        status: 'processed'
      })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Document uploaded and processed successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
