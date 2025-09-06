import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidas'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'gestion-residuos-app'
    }
  }
})

// Funciones para manejar la autenticación
export const authAPI = {
  async signUp(email, password, userMetadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en signUp:', error)
      return { data: null, error }
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en signIn:', error)
      return { data: null, error }
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error en signOut:', error)
      return { error }
    }
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en getSession:', error)
      return { data: null, error }
    }
  },

  async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en getUser:', error)
      return { data: null, error }
    }
  },

  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en resetPassword:', error)
      return { data: null, error }
    }
  }
}

// Funciones para manejar el contenido
export const contentAPI = {
  async savePageContent(pageName, content) {
    try {
      const { data: userData } = await authAPI.getUser()
      if (!userData.user) throw new Error('Usuario no autenticado')
      
      const { data, error } = await supabase
        .from('paginas')
        .upsert({
          nombre: pageName,
          contenido_html: content,
          usuario_id: userData.user.id,
          actualizado_en: new Date().toISOString()
        }, { 
          onConflict: 'nombre',
          ignoreDuplicates: false
        })
        
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en savePageContent:', error)
      return { data: null, error }
    }
  },

  async loadPageContent(pageName) {
    try {
      const { data, error } = await supabase
        .from('paginas')
        .select('contenido_html, actualizado_en')
        .eq('nombre', pageName)
        .single()
        
      if (error && error.code !== 'PGRST116') throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en loadPageContent:', error)
      return { data: null, error }
    }
  },

  async getPageHistory(pageName) {
    try {
      const { data, error } = await supabase
        .from('pagina_historial')
        .select('contenido_html, actualizado_en, usuario_id')
        .eq('nombre_pagina', pageName)
        .order('actualizado_en', { ascending: false })
        .limit(10)
        
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en getPageHistory:', error)
      return { data: null, error }
    }
  }
}

// Funciones para gestión de usuarios (solo admin)
export const adminAPI = {
  async getUsers() {
    try {
      const { data: userData } = await authAPI.getUser()
      if (!userData.user) throw new Error('No autenticado')
      
      // Verificar si el usuario es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()
        
      if (profile.role !== 'admin') throw new Error('No autorizado')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })
        
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en getUsers:', error)
      return { data: null, error }
    }
  },

  async updateUserRole(userId, newRole) {
    try {
      const { data: userData } = await authAPI.getUser()
      if (!userData.user) throw new Error('No autenticado')
      
      // Verificar si el usuario es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()
        
      if (profile.role !== 'admin') throw new Error('No autorizado')
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error en updateUserRole:', error)
      return { data: null, error }
    }
  }
}
