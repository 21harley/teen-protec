'use client'
import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import Link from "next/link"
import { useState } from "react"

export default function Dashboard(){

  return (
    <>
      <Header />
      <main>
         <h1>dashboard</h1>
      </main>
      <Footer />
    </>
  )
}