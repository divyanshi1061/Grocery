import { redirect } from "next/navigation";
import { auth } from "../auth";
import connectDb from "../lib/db";
import User from "../models/user.model";
import EditRoleMobile from "../components/EditRoleMobile";
import Nav from "../components/Nav";
import UserDashboard from "../components/UserDashboard";
import DeliveryBoyDashboard from "../components/DeliveryBoyDashboard";
import AdminDashboard from "../components/AdminDashboard";
import GeoUpdater from "../components/GeoUpdater";


async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q } = await searchParams;
  const searchQuery = typeof q === 'string' ? q : undefined;
  try {
    await connectDb()
  } catch (error) {
    console.error('DB connection failed', error)
    return (
      <div>
        <h2>Database connection error</h2>
        <p>Unable to reach the database. Check server logs and MONGO_URL.</p>
      </div>
    )
  }
  const session = await auth()
  const user = await User.findById(session?.user?.id)
  if (!user) {
    redirect("/login")
  }

  const isComplete = !user.mobile || !user.role || (!user.mobile && user.role == "user")
  if (isComplete) {
    return <EditRoleMobile />
  }

  const plainUser = JSON.parse(JSON.stringify(user))


  return (
    <div className="min-h-screen bg-white">
      <Nav user={plainUser} />
      <GeoUpdater userId={plainUser._id}/>
      {user.role == "user" ? (
        <UserDashboard searchQuery={searchQuery} />) :
        user.role == "admin" ? (
          <AdminDashboard />) :
          <DeliveryBoyDashboard />

      }
    </div>
  )
}
export default Home;