import { getRepositories } from "@/lib/github";

export default async function Page() {
    let data;
    try {
        data = await getRepositories();
    } catch (e: any) {
        data = { error: e.message };
    }
    
    return (
        <div>
            <h1>Dashboard</h1>
            <div>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    )
}